from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings

class Command(BaseCommand):
    help = 'Initialize the database for the application'

    def handle(self, *args, **kwargs):
        with connection.cursor() as cursor:
            cursor.execute(
                "CREATE DATABASE IF NOT EXISTS %s CHARACTER SET utf8mb4",
                [settings.DATABASES['default']['NAME']]
            )
            self.stdout.write(
                self.style.SUCCESS('Successfully created database')
            )
